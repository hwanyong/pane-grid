HOME= node -e 'console.log("empty:",JSON.stringify(require("os").homedir()))'
env -u HOME node -e 'console.log("unset:",JSON.stringify(require("os").homedir()))'
