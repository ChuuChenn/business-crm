import base from '@crm/config/eslint/base';
import globals from 'globals';

export default [...base, { languageOptions: { globals: { ...globals.browser } } }];
