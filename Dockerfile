FROM alpine:3.7
MAINTAINER Omid Hezaveh <Omid.Hezaveh@futurice.com>

# compiler and libs required to install pypi packages
RUN apk --no-cache add nodejs

# set up work area
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app


# deps install step: change infrequently, satisfied from cache
COPY package.json /usr/src/app/
RUN npm install && npm run build && npm install -g serve

# deploy and build app code
COPY . /usr/src/app/

# expose port
EXPOSE 8000

# set up runtime
CMD ["serve", "--single", "build", "--port", "8000"]
