declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Path (relative to this repo's root, or absolute) to the sibling
       * repository/app containing the cypress e2e tests.
       * @example "../teye-front"
       */
      E2E_APP_PATH?: string;

      /**
       * Path (relative to E2E_APP_PATH) to the directory containing spec
       * files.
       * @example "cypress/e2e"
       */
      TESTS_PATH?: string;
    }
  }
}

export {};
