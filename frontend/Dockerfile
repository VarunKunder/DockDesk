# frontend/Dockerfile

# --- Stage 1: Build the React application ---
# We use a Node.js image to build the static files.
# 'as builder' names this stage so we can refer to it later.
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to leverage Docker's layer caching.
# This step only re-runs if these files change.
COPY package.json yarn.lock ./

# Install all dependencies
RUN yarn install

# Copy the rest of the application's source code
COPY . .

# Build the application for production
# This creates a 'dist' or 'build' folder with the static files.
RUN yarn build


# --- Stage 2: Serve the static files with Nginx ---
# We use a lightweight and efficient web server.
FROM nginx:stable-alpine

# Copy the built static files from the 'builder' stage to the Nginx server directory.
# Make sure the source path ('/app/dist') matches your build output folder.
# If your build script creates a 'build' folder, change 'dist' to 'build'.
COPY --from=builder /app/dist /usr/share/nginx/html

# This is important for single-page applications (like React Router).
# It tells Nginx to serve 'index.html' for any page that it can't find.
# This allows your React app to handle all the routing.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world.
EXPOSE 80

# The default Nginx command will start the server.
CMD ["nginx", "-g", "daemon off;"]
