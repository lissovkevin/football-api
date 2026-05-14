// This file defines the GraphQL schema for the football match API, including types, queries, and mutations.
// Queries are read-only operations (no login needed).
// Mutations are write operations (login required). 
import { buildSchema } from "graphql";

export const schema = buildSchema(`
  type League {
    id: Int!
    name: String!
    country: String!
    matches: [Match!]!
  }

  type Team {
    id: Int!
    name: String!
    country: String!
  }

  type Match {
    id: Int!
    date: String!
    homeTeam: Team!
    awayTeam: Team!
    homeGoals: Int
    awayGoals: Int
    league: League!
    season: String!
  }

  type AuthPayload {
    token: String!
    message: String!
  }

  type DeleteResult {
    success: Boolean!
    message: String!
  }

  type Query {
    matches(page: Int, pageSize: Int, leagueId: Int, season: String): [Match!]!
    match(id: Int!): Match
    teams: [Team!]!
    team(id: Int!): Team
    leagues: [League!]!
    league(id: Int!): League
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    createMatch(
      date: String!
      homeTeamId: Int!
      awayTeamId: Int!
      homeGoals: Int
      awayGoals: Int
      leagueId: Int!
      season: String!
    ): Match!
    updateMatch(
      id: Int!
      homeGoals: Int
      awayGoals: Int
      date: String
    ): Match!
    deleteMatch(id: Int!): DeleteResult!
  }
`);