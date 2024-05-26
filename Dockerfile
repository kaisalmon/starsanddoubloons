# Use the official Node.js image as the base image
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package.json ./
COPY tsconfig.json ./
COPY dist/ dist/
COPY yarn.lock ./

# Install the dependencies
RUN yarn

# Copy the entire project directory to the working directory
COPY server/ server/

# Expose port 3000
EXPOSE 3000

# Specify the command to run your TypeScript file
CMD ["yarn", "host"]