// Allows `import "some.css"` inside dynamic async imports without TS errors
declare module "*.css" {
  const content: string;
  export default content;
}
