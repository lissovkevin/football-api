// This file combines all the individual resolvers into a single object
import { matchResolvers } from "./matchResolvers.js";
import { teamResolvers } from "./teamResolvers.js";
import { leagueResolvers } from "./leagueResolvers.js";
import { authResolvers } from "./authResolvers.js";

export const resolvers = {
  ...matchResolvers,
  ...teamResolvers,
  ...leagueResolvers,
  ...authResolvers,
};