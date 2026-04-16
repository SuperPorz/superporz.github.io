db.createCollection("lesson_contents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "lesson_id", "course_id", "video_url", "created_at"],
      properties: {
        "_id":       { bsonType: "objectId" },
        "lesson_id": { bsonType: "int" },      // FK verso PostgreSQL lessons.id
        "course_id": { bsonType: "int" },      // FK verso PostgreSQL courses.id
        "video_url": { bsonType: "string" },
        "transcript":{ bsonType: "string" },
        "attachments": {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["name", "url"],
            properties: {
              "name": { bsonType: "string" },
              "url":  { bsonType: "string" },
              "type": { bsonType: "string" }   // "pdf", "zip", "link"...
            }
          }
        },
        "quiz": {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["question", "options", "correct_index"],
            properties: {
              "question":      { bsonType: "string" },
              "options":       { bsonType: "array", items: { bsonType: "string" } },
              "correct_index": { bsonType: "int" }
            }
          }
        },
        "external_links": {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              "label": { bsonType: "string" },
              "url":   { bsonType: "string" }
            }
          }
        },
        "created_at":  { bsonType: "date" },
        "updated_at":  { bsonType: "date" }
      }
    }
  }
});