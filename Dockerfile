FROM public.ecr.aws/docker/library/node:20

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Copy packages
COPY src/packages/* ./src/packages/

#RUN npm install
# If you are building your code for production
RUN npm i --only=production

# Bundle app source
COPY . .

CMD [ "npm", "run", "start:bot:prod" ]
