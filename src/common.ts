import { Migrator } from "./migrator";

export const heating = async (): Promise<any> => {

  const deployer = new Migrator();
  await deployer.prepare();

  await deployer.process()
    .then((r) => {
      return r;
    })
    .catch((r) => {
      process.exit(1)
      return r;
    })

  await deployer.components()
    .then((r) => {
      return r;
    })
    .catch((r) => {
      console.log('r', r)
      process.exit(1)
      return r;
    })

  return await deployer.articles()
    .then((r) => {
      process.exit(0)
      return r;
    })
    .catch((r) => {
      process.exit(1)
      return r;
    })

  return true
}
