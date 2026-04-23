import { ApolloClient, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { cache } from './cache';

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/graphql',
  headers: {
    get Authorization() {
      const token = localStorage.getItem('access_token');
      return token ? `Bearer ${token}` : '';
    },
  },
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/graphql',
    connectionParams: () => {
      const token = localStorage.getItem('access_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    },
  }),
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  httpLink,
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
});
