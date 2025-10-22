<pre>

# 1. Install dependencies
npm install

# 2. build generate linux and .exe
npm run build

# 3. Build the .pkg
./build.sh

# 4. Install the package (manually)
sudo installer -pkg dist/naps2-service.pkg -target /

</pre>
