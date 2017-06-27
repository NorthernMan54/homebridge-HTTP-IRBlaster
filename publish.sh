git add .
git commit -m 'Initial release'
npm version patch
git push origin master --tags
npm publish
