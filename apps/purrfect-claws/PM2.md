### Executing a farmer with PM2


```bash
pm2 start ./claw --name example -- execute example
```

```js
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "example",
      script: "./claw",
      interpreter: "node",
      args: "execute example",
      autorestart: true,
      watch: false,
      max_restarts: 10,
    },
  ],
};
```