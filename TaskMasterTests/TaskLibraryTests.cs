using System.Diagnostics;
using TaskMaster.Objects;

namespace TaskMasterTests;

public class TaskLibraryTests
{
    [Fact]
    public void CreateTask()
    {
        TaskItemLibrary library = new TaskItemLibrary("TestLibrary");
        TaskItem item = library.GetOrCreate("testtask1");
        item.Description = "this is a test description";
        item.AddTag("testtag1");
        item.AddTag("anothertesttag");
        Assert.Contains(item, library.tasks);
        Assert.Contains(item, library.tasksByIsImportant[false]);
        Assert.Contains(item, library.tasksByIsUrgent[false]);
        Assert.Contains(item, library.requiringSave);
        Assert.Contains(item, library.TasksByTags["testtag1"]);
        Assert.Contains(item, library.TasksByTags["anothertesttag"]);
    }
    [Fact]
    public void CreateAndEditTask()
    {
        TaskItemLibrary library = new TaskItemLibrary("TestLibrary");
        TaskItem item = library.GetOrCreate("testtask1");
        item.Description = "this is a test description";
        item.AddTag("testtag1");
        item.AddTag("anothertesttag");
        
        item.RemoveTag("testtag1");
        item.AddTag("newesttesttag");
        item.IsImportant = true;
        item.IsUrgent = true;
        Assert.Contains(item, library.tasks);
        Assert.DoesNotContain(item, library.tasksByIsImportant[false]);
        Assert.Contains(item, library.tasksByIsImportant[true]);
        
        Assert.DoesNotContain(item, library.tasksByIsUrgent[false]);
        Assert.Contains(item, library.tasksByIsUrgent[true]);
        
        Assert.Contains(item, library.requiringSave);
        Assert.DoesNotContain("testtag1", library.TasksByTags.Keys);
        Assert.Contains(item, library.TasksByTags["anothertesttag"]);
        Assert.Contains(item, library.TasksByTags["newesttesttag"]);
    }

    [Fact]
    public void TrySaveTask()
    {
        TaskItemLibrary library = new TaskItemLibrary("TestLibrarySave");
        TaskItem item = library.GetOrCreate("testtask1");
        item.IsImportant = true;
        item.IsUrgent = true;
        item.Description = "this is a test description";
        item.AddTag("testtag1");
        item.AddTag("anothertesttag");
        library.Save();
        Assert.DoesNotContain(item, library.requiringSave);
        
        TaskItemLibrary loaded = new TaskItemLibrary("TestLibrarySave");
        Assert.Contains(item, library.tasks);
        Assert.Contains(item, loaded.tasksByIsImportant[true]);
        Assert.Contains(item, loaded.tasksByIsUrgent[true]);
        Assert.Contains(item, loaded.requiringSave);
        Assert.Contains(item, loaded.TasksByTags["testtag1"]);
        Assert.Contains(item, loaded.TasksByTags["anothertesttag"]);
    }
    [Fact]
    public void TryDeleteTask()
    {
        TaskItemLibrary library = new TaskItemLibrary("TestLibraryDelete");
        TaskItem item = library.GetOrCreate("testtask1");
        item.IsImportant = true;
        item.IsUrgent = true;
        item.Description = "this is a test description";
        item.AddTag("testtag1");
        item.AddTag("anothertesttag");
        library.Save();
        
        item.MarkForDeletion();
        Assert.DoesNotContain(item, library.tasks);
        Assert.DoesNotContain(item, library.tasksByIsImportant[true]);
        Assert.DoesNotContain(item, library.tasksByIsUrgent[true]);
        Assert.DoesNotContain(item, library.requiringSave);
        Assert.DoesNotContain("testtag1", library.TasksByTags.Keys);
        Assert.DoesNotContain("anothertesttag", library.TasksByTags.Keys);
        Assert.Contains(item, library.trashBin);
        library.Save();
        Assert.DoesNotContain(item, library.trashBin);
        
        TaskItemLibrary loaded = new TaskItemLibrary("TestLibraryDelete");
        Assert.DoesNotContain(item, loaded.tasks);
        Assert.DoesNotContain(true, loaded.tasksByIsImportant.Keys);
        Assert.DoesNotContain(true, loaded.tasksByIsUrgent.Keys);
        Assert.DoesNotContain(item, loaded.requiringSave);
        Assert.DoesNotContain("testtag1", loaded.TasksByTags.Keys);
        Assert.DoesNotContain("anothertesttag", loaded.TasksByTags.Keys);
    }
}