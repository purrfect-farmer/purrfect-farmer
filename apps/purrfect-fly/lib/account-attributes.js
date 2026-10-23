/** Account columns a manager listing may show, hiding titles unless enabled */
export function accountAttributes(app) {
  return {
    exclude: app.displayAccountTitle ? [] : ["title"],
  };
}
