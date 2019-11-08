#Development

## Use Modified Cuba-react Package Locally

Due development we usually need install modified cuba-react package locally 
as dependency for our project without publishing new version. It could be done following steps below.

* Go to cuba-react folder
* Create .tgz archive
```bash
npm pack
``` 
* Go to project folder, which need to use modified cuba-react package
* Install cuba-react to this project
```bash
npm install ../cuba-react/cuba-platform-react-1.1.1.tgz 
```

Where ```../cuba-react/cuba-platform-react-1.1.1.tgz``` path to generated package.