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
    public ConcurrentHashSet<TaskItem> trashBin = new();
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
    public TaskItem GetOrCreate(string taskName)
    {
        // If the current implementation uses a dictionary keyed by taskName:
        // Change 'tasks' to a ConcurrentDictionary<string, TaskItem> instead of a ConcurrentHashSet<TaskItem>.
        // This allows atomic GetOrAdd operations by task name.
        TaskItem query = new TaskItem(taskName, this);
        if (tasks.TryGet(query, out TaskItem taskItem)) return taskItem;
        if (query.FilePath.Exists) query = TaskItem.Load(query.FilePath.FullName, this);
        bool success = tasks.Add(query);
        ChangeTaskUrgency(query);
        ChangeTaskImportance(query);
        foreach (string tag in query.Tags) AddTaskTag(query, tag);
        return query;
    }
    
    /// <summary>
    /// Changes the urgency of a given task and updates the tasksByUrgency index accordingly.
    /// Returns true if successful, false if the task doesn't exist.
    /// </summary>
    public bool ChangeTaskUrgency(TaskItem taskItem)
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
    public bool ChangeTaskImportance(TaskItem taskItem)
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
        trashBin.Add(taskItem);
        requiringSave.TryRemove(taskItem, out _);
    }
    
    public void Save()
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

        foreach (TaskItem task in trashBin)
        {
            try
            {
                task.FilePath.Refresh();
                if (task.FilePath.Exists) task.FilePath.Delete();
                trashBin.TryRemove(task, out _);
            }
            catch (Exception ex)
            {
                Console.WriteLine("failed to delete old task: " + task.FilePath.Name);
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