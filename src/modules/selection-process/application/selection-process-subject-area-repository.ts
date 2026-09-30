export interface SelectionProcessSubjectAreaRepository {
  replaceAll(
    selectionProcessId: number,
    subjectAreaIds: number[],
  ): Promise<void>;
}