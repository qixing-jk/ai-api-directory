import {
  publicProjectionDtoSchema,
  type PublicProjectionDto,
} from "~/contracts/public/directory";

export type ProjectionRecordRow = {
  readonly projectionKey: string;
  readonly locale: string;
  readonly payload: unknown;
};

export function mapProjectionRecordToPublicDto(
  row: ProjectionRecordRow,
): PublicProjectionDto {
  return publicProjectionDtoSchema.parse(row.payload);
}
