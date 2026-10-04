import type { PrismaClient } from "@/generated/prisma/client";

import type { SelectionProcessDetailDto } from "../../application/dto/selection-process-detail.dto";
import type { SelectionProcessDetailRepository } from "../../application/repositories/selection-process-detail.repository";

export class PrismaSelectionProcessDetailRepository
  implements SelectionProcessDetailRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findById(
    id: number,
  ): Promise<SelectionProcessDetailDto | null> {
    const selectionProcess =
      await this.prisma.selectionProcess.findUnique({
        where: {
          id,
        },
        include: {
          institution: true,

          documents: {
            orderBy: {
              publicationDate: "desc",
            },
          },

          subjectAreas: {
            include: {
              subjectArea: true,
            },
          },
        },
      });

    if (!selectionProcess) {
      return null;
    }

    return {
      id: selectionProcess.id,

      cidoIdentifier: selectionProcess.cidoIdentifier,
      fileNumber: selectionProcess.fileNumber,
      publicOfferYear: selectionProcess.publicOfferYear,

      title: selectionProcess.title,
      isJobPool: selectionProcess.isJobPool,

      status: selectionProcess.status,
      scope: selectionProcess.scopeName,

      applicationStartDate:
        selectionProcess.applicationStartDate,
      applicationEndDate:
        selectionProcess.applicationEndDate,
      applicationEndTime:
        selectionProcess.applicationEndTime,
      applicationDeadlineNotes:
        selectionProcess.applicationDeadlineNotes,

      selectionSystem:
        selectionProcess.selectionSystem,
      personnelType:
        selectionProcess.personnelType,

      qualificationGroup:
        selectionProcess.qualificationGroup,
      requiredQualification:
        selectionProcess.requiredQualification,
      otherRequirements:
        selectionProcess.otherRequirements,

      numberOfPositions:
        selectionProcess.numberOfPositions,

      firstExamDate:
        selectionProcess.firstExamDate,
      observations:
        selectionProcess.observations,

      applicationUrl:
        selectionProcess.applicationUrl,
      institutionUrl:
        selectionProcess.institutionUrl,
      cidoUrl:
        selectionProcess.cidoUrl,

      lastDocumentPublicationDate:
        selectionProcess.lastDocumentPublicationDate,

      reservedPlaces: {
        disability:
          selectionProcess.reservedDisabilityPositions,
        unemployed:
          selectionProcess.reservedUnemployed,
        youngPeople:
          selectionProcess.reservedYoung,
        women:
          selectionProcess.reservedWomen,
      },

      institution: selectionProcess.institution
        ? {
            id: selectionProcess.institution.id,
            name: selectionProcess.institution.name,
            shortName:
              selectionProcess.institution.shortName,
            address:
              selectionProcess.institution.address,
            postalCode:
              selectionProcess.institution.postalCode,
            municipality:
              selectionProcess.institution.municipality,
            county:
              selectionProcess.institution.county,
            province:
              selectionProcess.institution.province,
            latitude:
              selectionProcess.institution.latitude?.toNumber() ??
              null,
            longitude:
              selectionProcess.institution.longitude?.toNumber() ??
              null,
          }
        : null,

      subjectAreas:
        selectionProcess.subjectAreas.map(
          ({ subjectArea }) => ({
            id: subjectArea.id,
            name: subjectArea.name,
          }),
        ),

      documents:
        selectionProcess.documents.map((document) => ({
          id: document.id,
          publicationDate: document.publicationDate,
          summary: document.summary,
          publisher: document.publisher,
          bulletin: document.bulletin,
          bulletinNumber: document.bulletinNumber,
          phase: document.phase,
          phaseNotes: document.phaseNotes,
          documentUrl: document.documentUrl,
          htmlUrl: document.htmlUrl,
        })),
    };
  }
}