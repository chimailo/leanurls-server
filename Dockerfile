FROM node:14.12-alpine

# set working directory
WORKDIR /usr/src/app

# add `/usr/src/node_modules/.bin` to $PATH
ENV PATH /usr/src/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/package.json
RUN npm install

# add app
COPY . .

# start app
CMD ["/usr/src/app/entrypoint.sh"]