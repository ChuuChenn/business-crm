import base from '@crm/config/eslint/base';

export default [...base, { ignores: ['playwright-report/**', 'test-results/**'] }];
