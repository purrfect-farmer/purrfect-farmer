import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import Container from "./Container";

const GRID_SIZES = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

const defaultRenderList = (content) => content;

const Tabs = ({
  children,
  rootClassName,
  listClassName,
  renderList = defaultRenderList,
  triggerClassName,
  tabs,
}) => {
  return (
    <TabsPrimitive.Root
      {...tabs.rootProps}
      className={cn("flex flex-col gap-2", rootClassName)}
    >
      <Container className="p-0 shrink-0">
        <TabsPrimitive.List
          className={cn("grid", GRID_SIZES[tabs.list.length], listClassName)}
        >
          {renderList(
            tabs.list.map((value, index) => (
              <TabsPrimitive.Trigger
                key={index}
                value={value}
                className={cn(
                  "p-2",
                  "border-b-4 border-transparent",
                  "data-[state=active]:border-blue-500",
                  triggerClassName
                )}
              >
                {value.toUpperCase()}
              </TabsPrimitive.Trigger>
            ))
          )}
        </TabsPrimitive.List>
      </Container>
      {children}
    </TabsPrimitive.Root>
  );
};

const TabsContent = (props) => (
  <TabsPrimitive.Content
    forceMount
    {...props}
    className={cn("data-[state=inactive]:hidden", props.className)}
  />
);

Tabs.Content = TabsContent;

export default Tabs;
