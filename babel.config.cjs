module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    // Jest runs CJS so import.meta is undefined. Stub it so import.meta.env.BASE_URL === '/'.
    function importMetaStub() {
      return {
        visitor: {
          MetaProperty(path) {
            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
              path.replaceWithSourceString('({ env: { BASE_URL: "/" } })');
            }
          },
        },
      };
    },
  ],
};
