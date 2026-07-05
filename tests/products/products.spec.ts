import { test, expect } from "@playwright/test";
import { ProductSchema } from "../../app/product.schema.ts";

function randomNum() {
  return Math.floor(Math.random() * 1_000_000);
}

test.describe(
  "Products API - with created product",
  { tag: ["@productCreation"] },
  () => {
    let createdProductSlug: string;
    let createdProductId: number;
    let updatedTitle: string;

    test.beforeEach(async ({ request }) => {
      const response = await request.post("/api/v1/products/", {
        data: {
          title: "New Product" + randomNum(),
          price: 10,
          description: "A description",
          categoryId: 2,
          images: ["https://placehold.co/600x400"],
        },
        failOnStatusCode: true,
      });
      const jsonCreatedProduct = await response.json();
      createdProductSlug = jsonCreatedProduct.slug;
      createdProductId = jsonCreatedProduct.id;
      updatedTitle = "Updated title" + Math.floor(Math.random() * 1_000_000);
    });

    test.afterEach(async ({ request }) => {
      const responseDelete = await request.delete(
        `/api/v1/products/${createdProductId}`,
      );
      const jsonDelete = await responseDelete.json();
      expect(jsonDelete).toBe(true);
      const afterDeleteGet = await request.get(
        `/api/v1/products/${createdProductId}`,
      );
      const jsonDeleteGet = await afterDeleteGet.json();
      expect(afterDeleteGet.status()).toBe(400);
      expect(jsonDeleteGet).toMatchObject({
        name: "EntityNotFoundError",
        path: `/api/v1/products/${createdProductId}`,
      });
    });

    test("get products - should be successful", async ({ request }) => {
      const result = await test.step("Get products", async () => {
        const response = await request.get("/api/v1/products");
        const json = await response.json();

        return {
          response,
          json,
        };
      });

      await test.step("Analyse response", async () => {
        expect(result.response.status()).toBe(200);

        expect(result.response.headers()["content-type"]).toContain("json");
      });

      await test.step("Analyse products list", async () => {
        expect(Array.isArray(result.json)).toBe(true);
        expect(result.json.length).toBeGreaterThan(0);
      });
    });
    test("get products by id - should be successful", async ({ request }) => {
      // Act
      const idRelated = await request.get(
        `/api/v1/products/${createdProductId}/related`,
      );
      // Assert
      const listIdRelated = await idRelated.json();
      const headersIdRelatedList = idRelated.headers();
      expect(headersIdRelatedList["content-type"]).toContain("json");
      expect(idRelated.status()).toBe(200);
      expect(idRelated.headers()).toBeDefined();
      //console.log(listIdRelated);
      console.log(createdProductId);
      expect(listIdRelated.every((item: any) => item.category.id === 2)).toBe(
        true,
      );
    });

    test("get products by id - should be successful1", async ({ request }) => {
      const result = await test.step("Get id related products", async () => {
        const response = await request.get(
          `/api/v1/products/${createdProductId}/related`,
        );

        const json = await response.json();

        return {
          response,
          json,
        };
      });

      const response = result.response;
      const json = result.json;

      await test.step("Verify HTTP response", async () => {
        expect(response.status()).toBe(200);

        expect(response.headers()["content-type"]).toContain("json");
      });

      await test.step("Verify returned data", async () => {
        expect(json.every((item: any) => item.category.id === 2)).toBe(true);
      });
    });

    test("get product related by slug - should be successful", async ({
      request,
    }) => {
      // Act
      const slugRelated = await request.get(
        `api/v1/products/slug/${createdProductSlug}/related`,
      );

      // Assert
      const json = await slugRelated.json();
      // console.log(json);
      expect(
        json.every((item: any) => item.category.slug === "electronics"),
      ).toBe(true);
    });

    test("check pagination - should be successful ", async ({ request }) => {
      // Act
      const response = await request.get("/api/v1/products", {
        params: {
          offset: 10,
          limit: 5,
        },
        failOnStatusCode: true,
      });

      // Assert
      const json = await response.json();
      console.log(json);
      expect(json.length).toBeLessThanOrEqual(10);
      expect(json[0]).toHaveProperty("id");
    });

    test("update products - should be successful", async ({ request }) => {
      //Act
      const updatedProductResponce = await request.put(
        `/api/v1/products/${createdProductId}`,
        {
          data: {
            title: updatedTitle,
            price: 10,
            description: "Updated description ",
            categoryId: 1,
            images: ["https://placehold.co/600x400"],
          },
        },
      );
      const jsonUpdatedProduct = await updatedProductResponce.json();
      expect(jsonUpdatedProduct.title === updatedTitle).toBeTruthy();
    });
  },
);
test.describe("Products API ", { tag: ["@createAndDelete"] }, async () => {
  test(
    "create products - should be successful",
    { tag: "@create" },
    async ({ request }) => {
      const createProductPost = await test.step("Create product", async () => {
        const title = "New Product" + randomNum();
        const response = await request.post("/api/v1/products/", {
          data: {
            title: title,
            price: 10,
            description: "A description",
            categoryId: 1,
            images: ["https://placehold.co/600x400"],
          },
          failOnStatusCode: true,
        });
        //Assert
        const json = await response.json();

        return {
          response,
          json,
          title,
        };
      });
      await test.step("Check json", () => {
        expect(createProductPost.json.title).toBe(createProductPost.title);
        expect(createProductPost.json.id).toBeDefined();
        expect(typeof createProductPost.json.id).toBe("number");
        expect(createProductPost.json.creationAt).toBeDefined();
        expect(createProductPost.json).toMatchObject({
          title: createProductPost.title,
          price: 10,
          description: "A description",
          images: ["https://placehold.co/600x400"],
          category: {
            id: 1,
          },
        });
      });
      await test.step("Check json", () => {
        const result = ProductSchema.safeParse(createProductPost.json);
        expect(result.success).toBe(true);
      });
    },
  );

  test(
    "delete products - should be successful",
    { tag: "@delete" },
    async ({ request }) => {
      const productCreation =
        await test.step("Create product to be deleted", async () => {
          const title = "New Product" + randomNum();
          const response = await request.post("/api/v1/products/", {
            data: {
              title: title,
              price: 10,
              description: "A description",
              categoryId: 1,
              images: ["https://placehold.co/600x400"],
            },
          });
          const jsonCreateForDelete = await response.json();
          const productIdDelete = jsonCreateForDelete.id;
          return {
            productIdDelete,
          };
        });

      const deleteProductRes = await test.step("Product deletion", async () => {
        const responseDeletion = await request.delete(
          `/api/v1/products/${productCreation.productIdDelete}`,
        );
        const jsonDelete = await responseDeletion.json();
        return {
          jsonDelete,
        };
      });

      await test.step("Check if the product deleted", async () => {
        expect(deleteProductRes.jsonDelete).toBe(true);
        const afterDeleteGet = await request.get(
          `/api/v1/products/${productCreation.productIdDelete}`,
        );
        const jsonDeleteGet = await afterDeleteGet.json();
        expect(afterDeleteGet.status()).toBe(400);
        expect(jsonDeleteGet).toMatchObject({
          name: "EntityNotFoundError",
          path: `/api/v1/products/${productCreation.productIdDelete}`,
        });
      });
    },
  );
});
/*   // Arrange
      const title = "New Product" + randomNum();
      const response = await request.post("/api/v1/products/", {
        data: {
          title: title,
          price: 10,
          description: "A description",
          categoryId: 1,
          images: ["https://placehold.co/600x400"],
        },
      });
      const jsonCreateForDelete = await response.json();
      const productIdDelete = jsonCreateForDelete.id;

      // Act
      const responseDelete = await request.delete(
        `/api/v1/products/${productIdDelete}`,
      );

      // Assert
      const jsonDelete = await responseDelete.json();
      expect(jsonDelete).toBe(true);
      const afterDeleteGet = await request.get(
        `/api/v1/products/${productIdDelete}`,
      );
      const jsonDeleteGet = await afterDeleteGet.json();
      expect(afterDeleteGet.status()).toBe(400);
      expect(jsonDeleteGet).toMatchObject({
        name: "EntityNotFoundError",
        path: `/api/v1/products/${productIdDelete}`,
      });
    },
  );*/
