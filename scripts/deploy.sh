#!/usr/bin/env bash
# Despliegue de Convoca'm en el VPS por SSH, con la misma estructura que Capistrano:
#
#   /var/www/convocam/
#   ├── current -> releases/AAAAMMDDHHMMSS   (enlace que usa el servicio systemd)
#   ├── releases/                             (se guardan las KEEP_RELEASES últimas)
#   ├── shared/.env, shared/backups/, shared/log/
#   ├── repo/                                 (copia espejo del repositorio de GitHub)
#   └── revisions.log
#
# Uso (desde la raíz del proyecto, en el portátil):
#   pnpm deploy:prod                  despliega origin/master
#   pnpm deploy:rollback              vuelve a la release anterior
#   SKIP_CHECKS=1 pnpm deploy:prod    sin lint, tsc ni tests en local
#   SKIP_CI=1 pnpm deploy:prod        sin comprobar el resultado de la CI en GitHub
#
# Antes de desplegar se exige que la CI de GitHub Actions haya terminado en verde
# para el commit exacto que se despliega (requiere gh con la sesión iniciada).
#
# Variables opcionales: DEPLOY_HOST, DEPLOY_USER, BRANCH.
# La configuración del servidor (systemd, nginx, sudoers) está en docs/servidor/.
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-convocam.duckdns.org}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
BRANCH="${BRANCH:-master}"
DEPLOY_TO="/var/www/convocam"
REPO_URL="git@github.com:jholgadorojo/convocam-app.git"
KEEP_RELEASES=5

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '\n==> %s\n' "$*"
}

# Se despliega lo que hay en GitHub, no lo que hay en local: el código local
# tiene que coincidir con origin/$BRANCH para que los checks tengan sentido.
check_pushed() {
  cd "$ROOT_DIR"
  log "Comprobando que $BRANCH está subida a GitHub"

  git fetch --quiet origin "$BRANCH"

  if [[ "$(git rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]]; then
    fail "No estás en la rama $BRANCH."
  fi
  if ! git diff --quiet HEAD; then
    fail "Hay cambios sin commit: los checks no corresponderían a lo que se despliega."
  fi
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH")" ]]; then
    fail "Tu $BRANCH no coincide con origin/$BRANCH: haz git push (o git pull)."
  fi

  COMMIT="$(git rev-parse HEAD)"
}

# El commit que se despliega tiene que tener la CI en verde, incluidos los tests
# de integración, que no se ejecutan en local.
check_ci() {
  if [[ "${SKIP_CI:-}" == "1" ]]; then
    log "SKIP_CI=1: no se comprueba la CI de GitHub Actions"
    return
  fi

  command -v gh >/dev/null 2>&1 \
    || fail "No se encuentra gh (GitHub CLI): instálalo y ejecuta gh auth login, o usa SKIP_CI=1."

  cd "$ROOT_DIR"
  log "Comprobando la CI de ${COMMIT:0:7} en GitHub Actions"

  local run
  run="$(gh run list --workflow ci.yml --commit "$COMMIT" --limit 1 \
    --json status,conclusion,url \
    --jq '.[0] | select(. != null) | "\(.status) \(.conclusion) \(.url)"')" \
    || fail "No se ha podido consultar GitHub Actions (¿gh auth login?)."

  if [[ -z "$run" ]]; then
    fail "No hay ninguna ejecución de la CI para ${COMMIT:0:7}."
  fi

  local status conclusion url
  read -r status conclusion url <<<"$run"

  if [[ "$status" != "completed" ]]; then
    fail "La CI de ${COMMIT:0:7} todavía se está ejecutando: espera a que termine. $url"
  fi
  if [[ "$conclusion" != "success" ]]; then
    fail "La CI de ${COMMIT:0:7} no está en verde ($conclusion): no se despliega. $url"
  fi

  log "CI en verde"
}

run_checks() {
  if [[ "${SKIP_CHECKS:-}" == "1" ]]; then
    log "SKIP_CHECKS=1: se omiten lint, tsc y tests"
    return
  fi

  cd "$ROOT_DIR"
  log "Lint"
  pnpm lint
  log "Tipos"
  pnpm exec tsc --noEmit
  log "Tests unitarios"
  pnpm test:run
}

# El servidor clona el repositorio privado con tu clave a través de ssh -A.
check_ssh_agent() {
  if ! ssh-add -l >/dev/null 2>&1; then
    fail "El agente SSH no tiene ninguna clave cargada: ejecuta ssh-add."
  fi
}

# Script que se ejecuta en el servidor. Recibe los parámetros como argumentos.
remote_script() {
  cat <<'REMOTE'
set -euo pipefail

ACTION="$1"
DEPLOY_TO="$2"
KEEP_RELEASES="$3"
REPO_URL="${4:-}"
BRANCH="${5:-}"
COMMIT="${6:-}"

RELEASES="$DEPLOY_TO/releases"
SHARED="$DEPLOY_TO/shared"
CURRENT="$DEPLOY_TO/current"

shopt -s nullglob

fail() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '\n==> %s\n' "$*"
}

# Cambia el enlace current de forma atómica: mv sobre un enlace es un rename,
# así que no hay ningún instante en que current no exista.
switch_current() {
  ln -sfn "$1" "$DEPLOY_TO/current.tmp"
  mv -Tf "$DEPLOY_TO/current.tmp" "$CURRENT"
}

restart_app() {
  log "Reiniciando el servicio convocam"
  sudo -n /usr/bin/systemctl restart convocam
}

healthcheck() {
  log "Comprobando que la aplicación responde"
  if ! curl -fsS -o /dev/null --retry 15 --retry-delay 2 --retry-connrefused \
    http://127.0.0.1:3000/; then
    fail "La aplicación no responde. Revisa: journalctl -u convocam -n 50. Para volver atrás: pnpm deploy:rollback"
  fi
  echo "OK"
}

record_revision() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >>"$DEPLOY_TO/revisions.log"
}

RELEASE_PATH=""
PUBLISHED=0

# Si algo falla antes de publicar, se borra la release a medias y la versión
# en marcha no se entera.
remove_unpublished_release() {
  local status=$?
  if [[ $status -ne 0 && $PUBLISHED -eq 0 && -n "$RELEASE_PATH" && -d "$RELEASE_PATH" ]]; then
    echo "Se borra la release a medias $(basename "$RELEASE_PATH")" >&2
    rm -rf -- "$RELEASE_PATH"
  fi
}

deploy() {
  [[ -f "$SHARED/.env" ]] || fail "No existe $SHARED/.env."

  local release_name release_path
  release_name="$(date +%Y%m%d%H%M%S)"
  release_path="$RELEASES/$release_name"
  RELEASE_PATH="$release_path"
  trap remove_unpublished_release EXIT

  log "Actualizando la copia del repositorio"
  if [[ -d "$DEPLOY_TO/repo" ]]; then
    git -C "$DEPLOY_TO/repo" remote set-url origin "$REPO_URL"
    git -C "$DEPLOY_TO/repo" remote update --prune
  else
    git clone --mirror "$REPO_URL" "$DEPLOY_TO/repo"
  fi
  git -C "$DEPLOY_TO/repo" cat-file -e "$COMMIT^{commit}" ||
    fail "El commit $COMMIT no está en GitHub."

  log "Creando la release $release_name (commit ${COMMIT:0:7})"
  mkdir -p "$release_path"
  git -C "$DEPLOY_TO/repo" archive "$COMMIT" | tar -x -C "$release_path"
  ln -s "$SHARED/.env" "$release_path/.env"

  cd "$release_path"

  log "Instalando dependencias"
  pnpm install --frozen-lockfile

  log "Generando el cliente Prisma"
  pnpm exec prisma generate --config prisma7.config.ts

  log "Compilando"
  pnpm build

  # Las migraciones van al final: si falla la compilación, la BD no se toca.
  log "Copia de la base de datos"
  local backup="$SHARED/backups/convocam-$release_name.dump"
  pg_dump -h localhost -U convocam -Fc -f "$backup" convocam
  local dumps=("$SHARED"/backups/convocam-*.dump)
  if ((${#dumps[@]} > KEEP_RELEASES)); then
    rm -- "${dumps[@]:0:${#dumps[@]}-KEEP_RELEASES}"
  fi

  log "Aplicando migraciones"
  pnpm exec prisma migrate deploy --config prisma7.config.ts

  log "Publicando la release"
  switch_current "$release_path"
  PUBLISHED=1
  record_revision "deploy $release_name $BRANCH $COMMIT"

  restart_app
  healthcheck

  log "Borrando releases antiguas (se guardan $KEEP_RELEASES)"
  local current_target releases
  current_target="$(readlink -f "$CURRENT")"
  releases=("$RELEASES"/*)
  if ((${#releases[@]} > KEEP_RELEASES)); then
    for old in "${releases[@]:0:${#releases[@]}-KEEP_RELEASES}"; do
      [[ "$old" == "$current_target" ]] || rm -rf -- "$old"
    done
  fi

  log "Desplegada la release $release_name"
}

rollback() {
  [[ -L "$CURRENT" ]] || fail "No hay ninguna release publicada."

  local current_target releases previous=""
  current_target="$(readlink -f "$CURRENT")"
  releases=("$RELEASES"/*)

  for release in "${releases[@]}"; do
    [[ "$release" == "$current_target" ]] && break
    previous="$release"
  done
  [[ -n "$previous" ]] || fail "No hay ninguna release anterior a $(basename "$current_target")."

  log "Volviendo de $(basename "$current_target") a $(basename "$previous")"
  echo "Las migraciones no se deshacen: las copias están en $SHARED/backups."
  switch_current "$previous"
  record_revision "rollback $(basename "$current_target") -> $(basename "$previous")"

  restart_app
  healthcheck
}

main() {
  # Impide dos despliegues (o rollbacks) a la vez.
  exec 9>"$DEPLOY_TO/deploy.lock"
  flock -n 9 || fail "Ya hay un despliegue en marcha."

  mkdir -p "$RELEASES"

  case "$ACTION" in
    deploy) deploy ;;
    rollback) rollback ;;
    *) fail "Acción desconocida: $ACTION" ;;
  esac
}

# Este script llega a bash por la entrada estándar: main lee de /dev/null para
# que pnpm, git o pg_dump no se coman el resto del script.
main </dev/null
REMOTE
}

run_remote() {
  ssh -A "$DEPLOY_USER@$DEPLOY_HOST" bash -s -- "$@" < <(remote_script)
}

case "${1:-}" in
  deploy)
    check_pushed
    check_ci
    check_ssh_agent
    run_checks
    log "Desplegando ${COMMIT:0:7} en $DEPLOY_HOST"
    run_remote deploy "$DEPLOY_TO" "$KEEP_RELEASES" "$REPO_URL" "$BRANCH" "$COMMIT"
    ;;
  rollback)
    run_remote rollback "$DEPLOY_TO" "$KEEP_RELEASES"
    ;;
  *)
    echo "Uso: $0 deploy|rollback" >&2
    exit 1
    ;;
esac
