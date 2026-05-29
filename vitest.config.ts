import path from 'path';

export default {
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
};
