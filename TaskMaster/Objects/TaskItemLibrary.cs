using System.Collections.Concurrent;
using Multithreading_Library.DataTransfer;

namespace TaskMaster.Objects;

public class TaskItemLibrary
{
    public TaskItemLibrary(string libraryName)
    {
        LibraryName = libraryName;
        Directory = new DirectoryInfo(Path.Combine("Tasks", libraryName));
        Load();
    }
    public string LibraryName { get; set; }
    public DirectoryInfo Directory { get; set; }
    public ConcurrentHashSet<TaskItem> tasks = new();
    public ConcurrentDictionary<bool, ConcurrentHashSet<TaskItem>> tasksByIsUrgent = new();
    public ConcurrentDictionary<bool, ConcurrentHashSet<TaskItem>> tasksByIsImportant = new();
    public ConcurrentDictionary<string, ConcurrentHashSet<TaskItem>> TasksByTags = new();
    public ConcurrentHashSet<TaskItem> requiringSave = new();
    public ConcurrentHashSet<FileInfo> NameTrashBin = new();

    /// <summary>
    /// Adds a task to the TasksByTags dictionary in a concurrent-safe manner.
    /// Creates a new set if the tag doesn't exist, or adds the task to the existing set.
    /// </summary>
    internal void AddTaskTag(TaskItem taskItem, string tag)
    {
        TasksByTags.AddOrUpdate(
            tag,
            _ =>
            {
                var newSet = new ConcurrentHashSet<TaskItem>();
                newSet.Add(taskItem);
                return newSet;
            },
            (key, existingSet) =>
            {
                existingSet.Add(taskItem);
                return existingSet;
            });
    }
    
    /// <summary>
    /// Removes a task from a specific tag’s set.
    /// If the tag set becomes empty, remove the entry from the dictionary.
    /// </summary>
    internal void RemoveTaskTag(TaskItem taskItem, string tag)
    {
        if (TasksByTags.TryGetValue(tag, out ConcurrentHashSet<TaskItem> existingSet))
        {
            existingSet.TryRemove(taskItem, out var _);
            if (existingSet.Count == 0)
            {
                TasksByTags.TryRemove(tag, out _);
            }
        }
    }

    /// <summary>
    /// Retrieves an existing task or creates a new one if it doesn't exist.
    /// Updates indexing dictionaries based on the task's initial properties.
    /// </summary>
    /// <summary>
    /// Retrieves an existing task or creates a new one if it doesn't exist.
    /// </summary>
    internal TaskItem GetOrCreate(string taskName)
    {
        // If the current implementation uses a dictionary keyed by taskName:
        // Change 'tasks' to a ConcurrentDictionary<string, TaskItem> instead of a ConcurrentHashSet<TaskItem>.
        // This allows atomic GetOrAdd operations by task name.
        TaskItem query = new TaskItem(taskName, this);
        if (tasks.TryGet(query, out TaskItem taskItem))
        {
            return taskItem;
        }
        if (query.FilePath.Exists) query = TaskItem.Load(query.FilePath.FullName, this);
        bool success = tasks.Add(query);
        ChangeTaskUrgency(query);
        ChangeTaskImportance(query);
        foreach (string tag in query.Tags) AddTaskTag(query, tag);
        return query;
    }

    public TaskItem GetOrCreate(string originalTitle, 
    string? newTitle = null, string? newDescription = null, bool? isUrgent = null, bool? isImportant = null, string[]? newTags = null)
{
    TaskItem original = GetOrCreate(originalTitle);

    // Remove the task from old collections
    if (!string.IsNullOrEmpty(newTitle) && newTitle != originalTitle)
    {
        TaskItem itemToDelete = new TaskItem(originalTitle, this);
        tasks.TryRemove(itemToDelete, out _);
        if (itemToDelete.FilePath.Exists) itemToDelete.FilePath.Delete();
    }

    if (isUrgent is not null && original.IsUrgent != isUrgent.Value)
    {
        if (tasksByIsUrgent.TryGetValue(original.IsUrgent, out var oldUrgencySet))
            oldUrgencySet.TryRemove(original, out _);

        original.IsUrgent = isUrgent.Value;

        tasksByIsUrgent.AddOrUpdate(original.IsUrgent,
            _ => new ConcurrentHashSet<TaskItem> { original },
            (_, set) => { set.Add(original); return set; });
    }

    if (isImportant is not null && original.IsImportant != isImportant.Value)
    {
        if (tasksByIsImportant.TryGetValue(original.IsImportant, out var oldImportanceSet))
            oldImportanceSet.TryRemove(original, out _);

        original.IsImportant = isImportant.Value;

        tasksByIsImportant.AddOrUpdate(original.IsImportant,
            _ => new ConcurrentHashSet<TaskItem> { original },
            (_, set) => { set.Add(original); return set; });
    }

    if (newTags is not null)
    {
        HashSet<string> newTagsSet = new HashSet<string>(newTags.Select(TaskItem.BuildTagName));

        // Remove task from old tag sets
        foreach (string tag in original.Tags)
        {
            if (!newTagsSet.Contains(tag))
                original.RemoveTag(tag);
        }

        // Add task to new tag sets
        foreach (string tag in newTagsSet)
        {
            if (!original.Tags.Contains(tag))
                original.AddTag(tag);
        }
    }

    if (!string.IsNullOrEmpty(newTitle) &&newTitle != originalTitle)
    {
        TaskItem itemToDelete = new TaskItem(originalTitle, this);
        tasks.TryRemove(itemToDelete, out _);
        if (itemToDelete.FilePath.Exists) itemToDelete.FilePath.Delete();
        original.Title = newTitle;
        tasks.Add(original);
    }
    if (!string.IsNullOrEmpty(newDescription)) original.Description = newDescription;

    original.Save();
    requiringSave.TryRemove(original, out _);

    return original;
}

    
    /// <summary>
    /// Changes the urgency of a given task and updates the tasksByUrgency index accordingly.
    /// Returns true if successful, false if the task doesn't exist.
    /// </summary>
    internal bool ChangeTaskUrgency(TaskItem taskItem)
    {
        if (!tasks.TryGet(taskItem, out TaskItem task))
            return false;
        if (tasksByIsUrgent.TryGetValue(!task.IsUrgent, out var oldSet))
            oldSet.TryRemove(task, out var _);
        
        tasksByIsUrgent.AddOrUpdate(task.IsUrgent,
            _ => new ConcurrentHashSet<TaskItem> { task },
            (_, set) => { set.Add(task); return set; });

        return true;
    }

    /// <summary>
    /// Changes the importance of a given task and updates the tasksByImportance index accordingly.
    /// Returns true if successful, false if the task doesn't exist.
    /// </summary>
    internal bool ChangeTaskImportance(TaskItem taskItem)
    {
        if (!tasks.TryGet(taskItem, out var task))
            return false;
        
        if (tasksByIsImportant.TryGetValue(!task.IsImportant, out var oldSet))
            oldSet.TryRemove(task, out var _);
        
        tasksByIsImportant.AddOrUpdate(task.IsImportant,
            _ => new ConcurrentHashSet<TaskItem> { task },
            (_, set) => { set.Add(task); return set; });

        return true;
    }

    public void DeleteTask(TaskItem taskItem)
    {
        tasks.TryRemove(taskItem, out _);
        if (tasksByIsUrgent.TryGetValue(taskItem.IsUrgent, out var oldUrgencySet))
            oldUrgencySet.TryRemove(taskItem, out var _);
        if (tasksByIsImportant.TryGetValue(taskItem.IsImportant, out var oldImportanceSet))
            oldImportanceSet.TryRemove(taskItem, out var _);
        foreach (string tag in taskItem.Tags)
        {
            RemoveTaskTag(taskItem, tag);
        }
        requiringSave.TryRemove(taskItem, out _);
        taskItem.FilePath.Refresh();                            
        if (taskItem.FilePath.Exists) taskItem.FilePath.Delete();   
    }
    
    internal void Save()
    {
        foreach (FileInfo path in NameTrashBin)
        {
            path.Refresh();
            try
            {
                if (path.Exists) path.Delete();
                NameTrashBin.TryRemove(path, out _);
            }
            catch (Exception ex)
            {
                Console.WriteLine("failed to delete old task: "+path.Name);
                Console.WriteLine(ex.Message);
            }
        }

        foreach (TaskItem task in requiringSave)
        {
            task.Save();
            requiringSave.TryRemove(task, out _);
        }
    }

    private void Load()
    {
        FileInfo[] tasks = new FileInfo[]{};
        if (Directory.Exists)
        {
            tasks = Directory.GetFiles("*.task");
        }    
        foreach (FileInfo task in tasks)
        {
            GetOrCreate(Path.GetFileNameWithoutExtension(task.Name));
        }
    }
    /// <summary>
    /// Provides a string representation of the TaskItemLibrary and the number of tasks.
    /// </summary>
    public override string ToString()
    {
        return $"TaskItemLibrary '{LibraryName}' with {tasks.Count} tasks.";
    }
}