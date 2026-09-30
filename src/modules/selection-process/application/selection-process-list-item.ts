export type SelectionProcessListItem = {
  id: number;
  cidoIdentifier: string;
  title: string;
  isJobPool: boolean;

  applicationEndDate: Date | null;

  qualificationGroup: string | null;
  status: string;
  cidoUrl: string;

  institution: {
    name: string;
    municipality: string | null;
    county: string | null;
    province: string | null;
  } | null;
};