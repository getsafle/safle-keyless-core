FROM node:14.17.0-alpine as react-build
ENV HOME=/home
ENV PATH $HOME/app/node_modules/.bin:$PATH
COPY . $HOME/app/
# COPY src/ $HOME/app/src
# COPY public/ $HOME/app/public
WORKDIR $HOME/app
RUN rm -rf node_modules/
RUN npm set unsafe-perm true
RUN npm install --force
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
ENTRYPOINT ["serve", "-s", "build", "-p", "3000"]
# ENTRYPOINT ["tail", "-f", "/dev/null"]