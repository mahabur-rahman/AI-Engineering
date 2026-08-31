export class GenerateRequestDto {
  prompt!: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  numPredict?: number;
  stream?: boolean;
}
