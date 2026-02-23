module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/lib': './src/lib',
            '@/hooks': './src/hooks',
            '@/context': './src/context',
            '@/constants': './src/constants',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
