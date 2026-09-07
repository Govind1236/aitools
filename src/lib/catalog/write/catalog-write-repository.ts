// ------------------------------------------------------------------
// CATALOG WRITE REPOSITORY (interface)
// ------------------------------------------------------------------
// The catalog CONTENT write boundary. NOT a generic CRUD abstraction —
// it exposes explicit domain operations. It is deliberately separated
// from the read-only CatalogRepository.
//
// Ownership rules:
//   * This boundary owns catalog CONTENT writes (Tool, Category, Provider,
//     Tag, Tool relationships).
//   * RedirectLink is OPERATIONAL (Prisma-owned). It is NEVER written by
//     this boundary as catalog content; the tool create/update flow keeps
//     the RedirectLink behaviour that the application already has (the
//     existing admin Tool page creates a redirect on tool creation), and
//     the Prisma compatibility synchronizer preserves the operational FK.
//
// Every operation returns a WriteResponse so callers can distinguish a
// genuine success from a failure and never silently report success when
// only part of the operation succeeded.
// ------------------------------------------------------------------

import type {
  CategoryWriteInput,
  CreateToolInput,
  ProviderWriteInput,
  TagWriteInput,
  UpdateToolInput,
  WriteResponse,
} from "./catalog-write-types";

export interface CatalogWriteRepository {
  /** Create a new tool (authoritative catalog write). */
  createTool(input: CreateToolInput): Promise<WriteResponse>;
  /** Update an existing tool (authoritative catalog write). */
  updateTool(id: string, input: UpdateToolInput): Promise<WriteResponse>;
  /** Publish a tool (soft transition to published). */
  publishTool(id: string): Promise<WriteResponse>;
  /** Unpublish a tool (soft transition, preferred over hard delete). */
  unpublishTool(id: string): Promise<WriteResponse>;
  /**
   * Genuine delete. Preserves existing admin UI behaviour (hard delete)
   * while cleaning up the Prisma compatibility rows so no operational
   * foreign key dangles. Prefer unpublishTool for reversible removal.
   */
  deleteTool(id: string): Promise<WriteResponse>;
  /** Create a category. */
  createCategory(input: CategoryWriteInput): Promise<WriteResponse>;
  /** Update a category. */
  updateCategory(id: string, input: CategoryWriteInput): Promise<WriteResponse>;
  /** Create a provider. */
  createProvider(input: ProviderWriteInput): Promise<WriteResponse>;
  /** Update a provider. */
  updateProvider(id: string, input: ProviderWriteInput): Promise<WriteResponse>;
  /** Create a tag. */
  createTag(input: TagWriteInput): Promise<WriteResponse>;
  /** Update a tag. */
  updateTag(id: string, input: TagWriteInput): Promise<WriteResponse>;
}
