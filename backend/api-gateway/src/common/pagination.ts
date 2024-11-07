export class Pagination<T> {
  constructor(
    public items: T[],
    public page: number,
    public pageSize: number,
    public totalElements: number,
  ) {}
}
