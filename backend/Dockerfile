# backend/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install app dependencies
RUN yarn install --production

# Copy the rest of the application's source code
COPY . .

# Build the TypeScript code into JavaScript
RUN yarn build

# Your app binds to port 3001, so we need to expose it
EXPOSE 3001

# Define the command to run your app
CMD [ "node", "dist/index.js" ]
