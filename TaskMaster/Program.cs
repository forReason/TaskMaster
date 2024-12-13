using TaskMaster.Objects;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//--------------------------------------------------------
// Setup Swagger in development
//--------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

//--------------------------------------------------------
// Initialize the TaskItemLibrary
//--------------------------------------------------------
var library = new TaskItemLibrary("DefaultLibrary");

//--------------------------------------------------------
// Endpoints
//--------------------------------------------------------

/// <summary>
/// Returns all tasks.
/// </summary>
app.MapGet("/tasks", () =>
    {
        List<string> results = new();
        foreach (TaskItem item in library.tasks) results.Add(item.Serialize());
        return results;
    })
    .WithName("GetAllTasks");


/// <summary>
/// Creates a new task or updates an existing one.
/// </summary>
app.MapPost("/tasks", (string title, string? newTitle ,string? description, bool? isUrgent, bool? isImportant, string[]? tags) =>
    {
        var task = library.GetOrCreate(title, newTitle: newTitle, newDescription: description, isUrgent: isUrgent, isImportant: isImportant, newTags: tags);
        return Results.Created($"/tasks/{task.Title}", task.Serialize());
    })
    .WithName("CreateTask");

/// <summary>
/// Deletes a task by name.
/// </summary>
app.MapDelete("/tasks/{taskName}", (string taskName) =>
    {
        var task = library.GetOrCreate(taskName);
        if (task is null)
        {
            return Results.NotFound();
        }
        library.DeleteTask(task);
        return Results.Ok();
    })
    .WithName("DeleteTask");

app.Run();