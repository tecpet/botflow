import { getTestAsset } from "@/test/utils/playwright";
import { createId } from "@paralleldrive/cuid2";
import test, { expect } from "@playwright/test";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import {
  createTypebots,
  importTypebotInDatabase,
} from "@typebot.io/playwright/databaseActions";
import { parseDefaultGroupWithBlock } from "@typebot.io/playwright/databaseHelpers";
import { latestTypebotVersion } from "@typebot.io/schemas/versions";

test.describe.configure({ mode: "parallel" });

test("Edges connection should work", async ({ page }) => {
  const typebotId = createId();
  await createTypebots([
    {
      id: typebotId,
    },
  ]);
  await page.goto(`/typebots/${typebotId}/edit`);
  await expect(page.getByTestId("event").getByText("Start")).toBeVisible();
  await page.dragAndDrop("text=Button", "#editor-container", {
    targetPosition: { x: 1000, y: 400 },
  });
  await page.dragAndDrop(
    "text=Text >> nth=0",
    '[data-testid="group"] >> nth=0',
    {
      targetPosition: { x: 100, y: 50 },
    },
  );
  await page.dragAndDrop(
    '[data-testid="endpoint"]',
    '[data-testid="group"] >> nth=0',
    { targetPosition: { x: 100, y: 10 } },
  );
  await expect(page.locator('[data-testid="edge"]')).toBeVisible();
  await page.dragAndDrop(
    '[data-testid="endpoint"]',
    '[data-testid="group"] >> nth=0',
  );
  await expect(page.locator('[data-testid="edge"]')).toBeVisible();
  await page.dragAndDrop("text=Date", "#editor-container", {
    targetPosition: { x: 1000, y: 800 },
  });
  await page.dragAndDrop(
    '[data-testid="endpoint"] >> nth=2',
    '[data-testid="group"] >> nth=1',
    {
      targetPosition: { x: 100, y: 10 },
    },
  );
  await expect(page.locator('[data-testid="edge"] >> nth=0')).toBeVisible();
  await expect(page.locator('[data-testid="edge"] >> nth=1')).toBeVisible();

  await page.click('[data-testid="clickable-edge"] >> nth=0', {
    force: true,
    button: "right",
  });
  await page.click("text=Delete");
  const total = await page.locator('[data-testid="edge"]').count();
  expect(total).toBe(1);
});

test("Rename and icon change should work", async ({ page }) => {
  const typebotId = createId();
  await createTypebots([
    {
      id: typebotId,
      name: "My awesome typebot",
      ...parseDefaultGroupWithBlock({
        type: InputBlockType.TEXT,
      }),
    },
  ]);

  await page.goto(`/typebots/${typebotId}/edit`);
  await page.click('[data-testid="editable-icon"]');
  await page.getByRole("button", { name: "Emoji" }).click();
  await expect(page.locator('text="My awesome typebot"')).toBeVisible();
  await page.fill('input[placeholder="Search..."]', "love");
  await page.click('text="😍"');
  await page.click('text="My awesome typebot"');
  await page.fill('input[value="My awesome typebot"]', "My superb typebot");
  await page.press('input[value="My superb typebot"]', "Enter");
  await page.click('[aria-label="Navigate back"]');
  await expect(page.locator('text="😍"')).toBeVisible();
  await expect(page.locator('text="My superb typebot"')).toBeVisible();
});

test("Preview from group should work", async ({ page }) => {
  const typebotId = createId();
  await importTypebotInDatabase(
    getTestAsset("typebots/editor/previewFromGroup.json"),
    {
      id: typebotId,
    },
  );

  await page.goto(`/typebots/${typebotId}/edit`);
  await page
    .getByTestId("group")
    .nth(0)
    .click({ position: { x: 100, y: 10 } });
  await page.click('[aria-label="Preview bot from this group"]');
  await expect(
    page.locator("typebot-standard").locator('text="Hello this is group 1"'),
  ).toBeVisible();
  await page
    .getByTestId("group")
    .nth(1)
    .click({ position: { x: 100, y: 10 } });
  await page.click('[aria-label="Preview bot from this group"]');
  await expect(
    page.locator("typebot-standard").locator('text="Hello this is group 2"'),
  ).toBeVisible();
  await page.click('[aria-label="Close"]');
  await page.click('text="Test"');
  await expect(
    page.locator("typebot-standard").locator('text="Hello this is group 1"'),
  ).toBeVisible();
});

test("Published typebot menu should work", async ({ page }) => {
  const typebotId = createId();
  await createTypebots([
    {
      id: typebotId,
      name: "My awesome typebot",
      ...parseDefaultGroupWithBlock({
        type: InputBlockType.TEXT,
      }),
      version: latestTypebotVersion,
    },
  ]);
  await page.goto(`/typebots/${typebotId}/edit`);
  await expect(page.getByTestId("event").getByText("Start")).toBeVisible();
  await expect(page.locator('button >> text="Published"')).toBeVisible();
  await page
    .getByRole("button", { name: "Show published typebot menu" })
    .click();
  await page.click('text="Close typebot to new responses"');
  await expect(page.locator('button >> text="Closed"')).toBeDisabled();
  await page.waitForTimeout(200);
  await page
    .getByRole("button", { name: "Show published typebot menu" })
    .blur();
  await page
    .getByRole("button", { name: "Show published typebot menu" })
    .click();
  await page.click('text="Reopen typebot to new responses"');
  await expect(page.locator('button >> text="Published"')).toBeDisabled();
  await page.waitForTimeout(200);
  await page
    .getByRole("button", { name: "Show published typebot menu" })
    .blur();
  await page
    .getByRole("button", { name: "Show published typebot menu" })
    .click();
  await page.click('button >> text="Unpublish typebot"');
  await page.click('button >> text="Publish"');
  await expect(page.locator('button >> text="Published"')).toBeVisible();
});
