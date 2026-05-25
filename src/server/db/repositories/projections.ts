import {
  mapProjectionRecordToPublicDto,
  type ProjectionRecordRow,
} from "../mappers/public-projection";

export type ProjectionRowSource = {
  readonly listProjectionRows: () => Promise<readonly ProjectionRecordRow[]>;
};

export function createProjectionReader(source: ProjectionRowSource) {
  return {
    async listPublicProjections() {
      const rows = await source.listProjectionRows();
      return rows.map(mapProjectionRecordToPublicDto);
    },
  };
}
