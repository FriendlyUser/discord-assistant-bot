import { GraphQLObjectType, GraphQLString } from 'graphql'
import taskTypeGraphQLType from './types/taskType'
const addTask = require('./mutations/addTask')
const updateTask = require('./mutations/updateTask')
const removeTask = require('./mutations/removeTask')
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addTask,
    updateTask,
    removeTask
  }
})

module.exports = Mutation;