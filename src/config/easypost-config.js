/* EasyPost related configuration.

NOTE: EASYPOST_API_KEY is mandatory environment variable.
This variable is set in a hidden file: .env
To make Stripe connection work, you also need to set Stripe's private key in the Flex Console.
*/

export const easypostAPIKey = process.env.EASYPOST_API_KEY;

/**
 *
 * We'll use defaults for a normal sized piece of clothing.
 *
 */
export const defaultLength = '1';
export const defaultWidth = '1';
export const defaultHeight = '1';
export const defaultWeight = '1';