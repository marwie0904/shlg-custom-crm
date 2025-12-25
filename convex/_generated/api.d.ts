/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as documents from "../documents.js";
import type * as intake from "../intake.js";
import type * as invoices from "../invoices.js";
import type * as opportunities from "../opportunities.js";
import type * as pipelineStages from "../pipelineStages.js";
import type * as products from "../products.js";
import type * as stageCompletionMappings from "../stageCompletionMappings.js";
import type * as taskTemplates from "../taskTemplates.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as workshops from "../workshops.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  contacts: typeof contacts;
  conversations: typeof conversations;
  documents: typeof documents;
  intake: typeof intake;
  invoices: typeof invoices;
  opportunities: typeof opportunities;
  pipelineStages: typeof pipelineStages;
  products: typeof products;
  stageCompletionMappings: typeof stageCompletionMappings;
  taskTemplates: typeof taskTemplates;
  tasks: typeof tasks;
  users: typeof users;
  workshops: typeof workshops;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
