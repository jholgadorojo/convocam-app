
import type {
  TerritorialPreferenceOptionsDto,
} from "../dto/territorial-preference-options.dto";

export interface TerritorialPreferenceOptionsQueryRepository {
  listAll(): Promise<TerritorialPreferenceOptionsDto>;
}
