import { createId } from "@paralleldrive/cuid2";
import test, { expect } from "@playwright/test";
import { InputBlockType } from "@typebot.io/blocks-inputs/constants";
import { createTypebots } from "@typebot.io/playwright/databaseActions";
import { parseDefaultGroupWithBlock } from "@typebot.io/playwright/databaseHelpers";

test.describe("Date input block", () => {
  test("options should work", async ({ page }) => {
    const typebotId = createId();
    await createTypebots([
      {
        id: typebotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.DATE,
        }),
      },
    ]);

    await page.goto(`/typebots/${typebotId}/edit`);

    await page.click("text=Test");
    await expect(page.locator('[data-testid="from-date"]')).toHaveAttribute(
      "type",
      "date",
    );
    await page.locator('[data-testid="from-date"]').fill("2021-01-01");
    await page.getByLabel("Send").click();
    await expect(page.locator('text="01/01/2021"')).toBeVisible();

    await page.click(`text=Pick a date`);
    await page.click("text=Is range");
    await page.click("text=With time");
    await page.getByLabel("From label:").fill("Previous:");
    await page.getByLabel("To label:").fill("After:");
    await page.getByLabel("Button label:").fill("Go");

    await page.click("text=Restart");
    await expect(page.locator(`[data-testid="from-date"]`)).toHaveAttribute(
      "type",
      "datetime-local",
    );
    await expect(page.locator(`[data-testid="to-date"]`)).toHaveAttribute(
      "type",
      "datetime-local",
    );
    await page.locator('[data-testid="from-date"]').fill("2021-01-01T11:00");
    await page.locator('[data-testid="to-date"]').fill("2022-01-01T09:00");
    await page.getByRole("button", { name: "Go" }).click();
    await expect(
      page.locator('text="01/01/2021 11:00 to 01/01/2022 09:00"'),
    ).toBeVisible();

    await page.click(`text=Pick a date`);
    await page.getByPlaceholder("dd/MM/yyyy HH:mm").fill("dd.MM HH:mm");
    await page.click("text=Restart");
    await page.locator('[data-testid="from-date"]').fill("2023-01-01T11:00");
    await page.locator('[data-testid="to-date"]').fill("2023-02-01T09:00");
    await page.getByRole("button", { name: "Go" }).click();
    await expect(
      page.locator('text="01.01 11:00 to 01.02 09:00"'),
    ).toBeVisible();
  });

  test("min/max date validation should work", async ({ page }) => {
    const typebotId = createId();
    await createTypebots([
      {
        id: typebotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.DATE,
        }),
      },
    ]);

    await page.goto(`/typebots/${typebotId}/edit`);

    await page.click("text=Test");

    // Return to edit mode to set min/max dates
    await page.click(`text=Pick a date`);
    await page.getByLabel("Min:").fill("2023-01-01");
    await page.getByLabel("Max:").fill("2023-12-31");

    await page.click("text=Restart");

    // Browser native validation should prevent entering dates outside range
    await expect(page.locator('[data-testid="from-date"]')).toHaveAttribute(
      "min",
      "2023-01-01",
    );
    await expect(page.locator('[data-testid="from-date"]')).toHaveAttribute(
      "max",
      "2023-12-31",
    );

    // Test valid date within range
    await page.locator('[data-testid="from-date"]').fill("2023-06-15");
    await page.getByLabel("Send").click();
    await expect(page.locator('text="15/06/2023"')).toBeVisible();
  });

  test("keyboard navigation and form submission should work", async ({
    page,
  }) => {
    const typebotId = createId();
    await createTypebots([
      {
        id: typebotId,
        ...parseDefaultGroupWithBlock({
          type: InputBlockType.DATE,
        }),
      },
    ]);

    await page.goto(`/typebots/${typebotId}/edit`);
    await page.click("text=Test");

    // Fill the date and submit using Enter key
    await page.locator('[data-testid="from-date"]').fill("2023-07-04");
    await page.locator('[data-testid="from-date"]').press("Enter");
    await expect(page.locator('text="04/07/2023"')).toBeVisible();
  });
});
