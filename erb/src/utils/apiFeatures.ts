import { Op, Sequelize } from "sequelize";

export class ApiFeatures {
  queryOptions: any = {};
  searchQuery: any;

  pageNumber: number = 1;
  pageLimit: number = 20;

  private searchFields: string[] = [];

  constructor(searchQuery: any) {
    this.searchQuery = searchQuery;

    this.queryOptions = {
      where: {},
      order: [],
      limit: 20,
      offset: 0,
      attributes: { exclude: [] },
    };
  }

  // ✅ Pagination
  pagination() {
    if (this.searchQuery.page <= 0) this.searchQuery.page = 1;

    const pageNumber = Number(this.searchQuery.page) || 1;
    const pageLimit = Number(this.searchQuery.limit) || 20;
    const offset = (pageNumber - 1) * pageLimit;

    this.pageNumber = pageNumber;
    this.pageLimit = pageLimit;

    this.queryOptions.limit = pageLimit;
    this.queryOptions.offset = offset;

    return this;
  }

  // ✅ Filter
  filter() {
    let filterObj = { ...this.searchQuery };

    const executedFields = [
      "page",
      "sort",
      "fields",
      "keyword",
      "limit",
      "age_min",
      "age_max",
      "salary_min",
      "salary_max",
      "contract_department_id",
      "department_id",
      "has_contract",
      "has_experience",
      "employees_only",
      "employee_age_min",
      "employee_age_max",
      "from_year",
      "to_year",
      "period",
      "month",
      "year",
    ];
    executedFields.forEach((val) => delete filterObj[val]);

    const operators: any = {
      gt: Op.gt,
      gte: Op.gte,
      lt: Op.lt,
      lte: Op.lte,
    };

    Object.keys(filterObj).forEach((key) => {
      let value = filterObj[key];
      if (value && typeof value === "object") {
        const newObj: any = {};
        for (const prop in value) {
          if (operators[prop]) {
            newObj[operators[prop]] = value[prop];
          } else {
            newObj[prop] = value[prop];
          }
        }
        filterObj[key] = newObj;
      }
    });

    this.queryOptions.where = {
      ...this.queryOptions.where,
      ...filterObj,
    };

    return this;
  }

  // ✅ Sort
  sort() {
    if (this.searchQuery.sort) {
      let sortBy = this.searchQuery.sort;

      if (sortBy === "date") {
        this.queryOptions.order = [["createdAt", "DESC"]];
      } else if (sortBy === "period") {
        this.queryOptions.order = [
          ["year", "DESC"],
          ["month", "DESC"],
        ];
      } else if (sortBy === "name") {
        this.queryOptions.order = [["name", "ASC"]];
      } else {
        const fields = sortBy.split(",");
        this.queryOptions.order = fields.map((field: string) => [
          field,
          "ASC",
        ]);
      }
    }

    return this;
  }

  // ✅ Fields
  fields() {
    if (this.searchQuery.fields) {
      const fields = this.searchQuery.fields.split(",");
      this.queryOptions.attributes = {
        exclude: fields.map((f: string) => f.trim()),
      };
    }

    return this;
  }

  // ✅ Dynamic Search
  search(fields: string[] = ["name"]) {
    this.searchFields = fields;

    if (this.searchQuery.keyword) {
      const keyword = this.searchQuery.keyword;

      this.queryOptions.where = {
        ...this.queryOptions.where,
        [Op.or]: fields.map((field) => {
          // Remove $ signs used for nested includes to get the raw column path
          const colName = field.replace(/\$/g, "");
          return Sequelize.where(
            Sequelize.cast(Sequelize.col(colName), "varchar"),
            { [Op.iLike]: `%${keyword}%` }
          );
        }),
      };
    }

    return this;
  }
}