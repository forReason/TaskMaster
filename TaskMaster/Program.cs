using TaskMaster.Objects;

var builder = WebApplication.CreateBuilder(args);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors(); // Enable CORS middleware

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

var library = new TaskItemLibrary("DefaultLibrary");

app.MapGet("/tasks", () =>
    {
        var result = library.tasks.Select(task => new
        {
            task.Title,
            task.Description,
            task.IsUrgent,
            task.IsImportant,
            Tags = task.Tags.ToArray()
        }).ToList();
        return result;
    })
    .WithName("GetAllTasks");

app.MapPost("/tasks", (string title, string? newTitle, string? description, bool? isUrgent, bool? isImportant) =>
{
    try
    {
        // Log all incoming values
        Console.WriteLine($"Title: {title}");
        Console.WriteLine($"NewTitle: {newTitle}");
        Console.WriteLine($"Description: {description}");
        Console.WriteLine($"IsUrgent: {isUrgent}");
        Console.WriteLine($"IsImportant: {isImportant}");

        // Attempt to process the task
        library.GetOrCreate(title, newTitle: newTitle, newDescription: description, isUrgent: isUrgent, isImportant: isImportant);

        // Return OK on success
        return Results.Ok("OK");
    }
    catch (Exception ex)
    {
        // Log the error for debugging
        Console.WriteLine($"Error: {ex.Message}");
        Console.WriteLine($"StackTrace: {ex.StackTrace}");

        // Return a generic error message
        return Results.Problem("An error occurred while processing the request.");
    }
}).WithName("CreateTask");

// Get the active task
app.MapGet("/tasks/active", () =>
{
    return Results.Ok(library.ActiveTask);
}).WithName("GetActiveTask");

// Set the active task
app.MapPost("/tasks/active", (string taskId) =>
{
    try
    {
        // Validate that the task exists
        if (!library.tasks.Any(task => task.Title == taskId))
        {
            return Results.NotFound($"Task with ID '{taskId}' not found.");
        }

        // Update the active task
        library.SaveActiveTask(taskId);
        return Results.Ok($"Active task set to '{taskId}'.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error setting active task: {ex.Message}");
        return Results.Problem("Failed to set active task.");
    }
}).WithName("SetActiveTask");

app.MapDelete("/tasks/{taskName}", (string taskName) =>
{
    var task = library.GetOrCreate(taskName);
    if (task is null) return Results.NotFound();
    library.DeleteTask(task);
    return Results.Ok();
}).WithName("DeleteTask");

app.Run();