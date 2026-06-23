import { test, expect, request } from "@playwright/test";

function randomNum() {
  return Math.floor(Math.random() * 1_000_000);
}

test("get products - should be successful", async ({ request }) => {
  const response = await request.get("/api/v1/products");

  expect(response.status()).toBe(200);
  expect(response.headers()).toBeTruthy();
});

test("create products - should be successful", async ({ request }) => {
  const response = await request.post("/api/v1/products/", {
    data: {
      title: "New Product" + randomNum(),
      price: 10,
      description: "A description",
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
    failOnStatusCode: true,
  });
  const json = await response.json();

  expect(json.title === "New Product" + randomNum()).toBeTruthy;
});

test("update products - should be successful", async ({ request }) => {
  const response = await request.post("/api/v1/products/", {
    data: {
      title: "New Product" + randomNum(),
      price: 10,
      description: "A description",
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
    failOnStatusCode: true,
  });
  const jsonCreate = await response.json();
  const productId = jsonCreate.id;
  const updatedTitle = "Updated title" + Math.floor(Math.random() * 1_000_000);

  const updatedProductResponce = await request.put(
    `/api/v1/products/${productId}`,
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

test("delete products - should be successful", async ({ request }) => {
  const response = await request.post("/api/v1/products/", {
    data: {
      title: "New Product" + randomNum(),
      price: 10,
      description: "A description",
      categoryId: 1,
      images: ["https://placehold.co/600x400"],
    },
  });
  const jsonDelete = await response.json();
  const productIdDelete = jsonDelete.id;

  await request.delete(`/api/v1/products/${productIdDelete}`);
});

test("check pagination", async ({ request }) => {
  const response = await request.get("/api/v1/products", {
    params: {
      offset: 10,
      limit: 5,
    },
    failOnStatusCode: true,
  });

  const json = await response.json();
  console.log(json);
  expect(json.length).toBeLessThanOrEqual(10);
  expect(json[0]).toHaveProperty("id");
});

test("get products by id - should be successful", async ({ request }) => {
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
  const json = await response.json();
  const id = json.id;

  const idRelated = await request.get(`/api/v1/products/${id}/related`);

  expect(idRelated.status()).toBe(200);
});

test("get product related by slug", async ({ request }) => {
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
  const createdProductSlug = jsonCreatedProduct.slug;

  const slugRelated = await request.get(
    `api/v1/products/slug/${createdProductSlug}/related`,
  );

  const json = await slugRelated.json();
  console.log(json);
  expect(json.every((item: any) => item.category.slug === "stoppp")).toBe(true);
});
