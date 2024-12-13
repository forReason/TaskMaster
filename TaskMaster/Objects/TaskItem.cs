using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;
using Multithreading_Library.DataTransfer;

namespace TaskMaster.Objects
{
    /// <summary>
    /// Represents a task item with title, description, urgency, importance, tags, and subtasks.
    /// </summary>
    public sealed class TaskItem
    {
        public TaskItem(string name, TaskItemLibrary parentLibrary)
        {
            _title = name;
            _hashCode = ComputeHash(_title);
            ParentLibrary = parentLibrary;
            FilePath = new FileInfo(Path.Combine(ParentLibrary.Directory.FullName, BuildTagName(Title) + ".task"));
        }
        private int _hashCode;
        private string _title = "untitled Task...";
        public FileInfo FilePath { get; private set; }

        /// <summary>
        /// Gets or sets the title of the task.
        /// Internal modification triggers change tracking and renames in the parent library.
        /// </summary>
        public string Title
        {
            get => _title;
            set
            {
                if (_title == value) return;
                ParentLibrary.NameTrashBin.Add(FilePath);
                _title = value;
                _hashCode = ComputeHash(_title);
                ParentLibrary.requiringSave.Add(this);
                changesMade = true;
                FilePath = new FileInfo(Path.Combine(ParentLibrary.Directory.FullName, BuildTagName(Title) + ".task"));
            }
        }

        private string _description = "empty description...";
        
        /// <summary>
        /// Gets or sets the description of the task.
        /// Internal modification triggers change tracking.
        /// </summary>
        public string Description
        {
            get => _description;
            set
            {
                if (_description == value) return;
                _description = value;
                changesMade = true;
                ParentLibrary.requiringSave.Add(this);
            }
        }
        
        /// <summary>
        /// Concurrent set of tags associated with the task.
        /// </summary>
        private ConcurrentHashSet<string> _tags { get; set; } = new ConcurrentHashSet<string>();

        /// <summary>
        /// Gets the tags associated with this task.
        /// </summary>
        public string[] Tags => _tags.ToArray();

        /// <summary>
        /// Converts a provided tag into a normalized, alphanumeric format.
        /// </summary>
        /// <param name="tag">The raw tag string.</param>
        /// <returns>Normalized tag string.</returns>
        private static string BuildTagName(string tag)
        {
            if (string.IsNullOrEmpty(tag)) throw new NullReferenceException("tag seems to be empty or not parsable!");
            StringBuilder tagBuilder = new StringBuilder();
            foreach (char c in tag)
            {
                if (!char.IsLetterOrDigit(c)) continue;
                tagBuilder.Append(char.ToLowerInvariant(c));
            }

            tag = tagBuilder.ToString(); 
            if (string.IsNullOrEmpty(tag)) throw new NullReferenceException("tag seems to be empty or not parsable!");
            return tag;
        }

        /// <summary>
        /// Adds a normalized tag to this task and updates parent library references.
        /// </summary>
        /// <param name="tag">The raw tag to be added.</param>
        public void AddTag(string tag)
        {
            tag = BuildTagName(tag);
            if (_tags.Add(tag))
            {
                changesMade = true;
                ParentLibrary.AddTaskTag(this, tag);
                ParentLibrary.requiringSave.Add(this);
            }
        }

        /// <summary>
        /// Removes a tag from this task and updates parent library references.
        /// </summary>
        /// <param name="tag">The raw tag to be removed.</param>
        public void RemoveTag(string tag)
        {
            tag = BuildTagName(tag);
            if (_tags.TryRemove(tag, out _))
            {
                changesMade = true;
                ParentLibrary.RemoveTaskTag(this, tag);
                ParentLibrary.requiringSave.Add(this);
            }
        }

        
        private bool _isUrgent = false;
        /// <summary>
        /// Gets or sets the urgency of this task.
        /// </summary>
        public bool IsUrgent
        {
            get => _isUrgent;
            set
            {
                if (_isUrgent == value) return;
                _isUrgent = value;
                changesMade = true;
                ParentLibrary.ChangeTaskUrgency(this);
                ParentLibrary.requiringSave.Add(this);
            }
        }

        private bool _isImportant = false;
        /// <summary>
        /// Gets or sets the importance of this task.
        /// </summary>
        public bool IsImportant 
        {
            get => _isImportant;
            set
            {
                if (_isImportant == value) return;
                _isImportant = value;
                changesMade = true;
                ParentLibrary.ChangeTaskImportance(this);
                ParentLibrary.requiringSave.Add(this);
            }
        }

        /// <summary>
        /// Tracks if changes were made to this task since last save or retrieval.
        /// </summary>
        public bool changesMade { get; internal set; } = true; 

        /// <summary>
        /// Reference to the parent task library, used for managing tags and renames.
        /// </summary>
        public TaskItemLibrary ParentLibrary { get; set; }
        
         /// <summary>
        /// Saves the current TaskItem to a file as JSON.
        /// </summary>
        public void Save()
        {
            if (!changesMade) return;
            if (!ParentLibrary.Directory.Exists) ParentLibrary.Directory.Create();
            string fileName = Path.Combine(ParentLibrary.Directory.FullName, BuildTagName(Title) + ".task");

            var data = new
            {
                Title = this.Title,
                Description = this.Description,
                Tags = this.Tags,
                IsUrgent = this.IsUrgent,
                IsImportant = this.IsImportant
            };

            string json = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(fileName, json);
            changesMade = false;
            FilePath.Refresh();
        }

        /// <summary>
        /// Loads a TaskItem from the specified file and associates it with the given TaskItemLibrary.
        /// </summary>
        /// <summary>
        /// Loads a TaskItem from the specified file and associates it with the given TaskItemLibrary.
        /// </summary>
        public static TaskItem Load(string path, TaskItemLibrary library)
        {
            if (!File.Exists(path)) 
                throw new FileNotFoundException("Task file not found.", path);

            string json = File.ReadAllText(path);
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            string title = root.TryGetProperty("Title", out var titleProp) ? titleProp.GetString() ?? "untitled Task..." : "untitled Task...";
            var task = new TaskItem(title, library)
            {
                _description = root.TryGetProperty("Description", out var descProp) ? (descProp.GetString() ?? "empty description...") : "empty description..."
            };

            if (root.TryGetProperty("Tags", out var tagsProp) && tagsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var t in tagsProp.EnumerateArray())
                {
                    var tagStr = t.GetString();
                    if (!string.IsNullOrWhiteSpace(tagStr))
                        task._tags.Add(tagStr);
                }
            }

            if (root.TryGetProperty("IsUrgent", out var urgProp) && urgProp.ValueKind == JsonValueKind.True || urgProp.ValueKind == JsonValueKind.False)
                task.IsUrgent = urgProp.GetBoolean();

            if (root.TryGetProperty("IsImportant", out var impProp) && impProp.ValueKind == JsonValueKind.True || impProp.ValueKind == JsonValueKind.False)
                task.IsImportant = impProp.GetBoolean();

            task.changesMade = false;
            return task;
        }

        public void MarkForDeletion()
        {
            this.ParentLibrary.DeleteTask(this);
        }

        /// <inheritdoc />
        public override int GetHashCode()
        {
            return _hashCode;
        }

        /// <summary>
        /// Computes a case-insensitive hash from a given input string.
        /// </summary>
        /// <param name="input">The string to compute the hash for.</param>
        /// <returns>The computed hash code.</returns>
        private static int ComputeHash(string input)
        {
            return input.GetHashCode(StringComparison.OrdinalIgnoreCase);
        }

        /// <inheritdoc />
        public override bool Equals([NotNullWhen(true)] object obj)
        {
            if (obj is TaskItem other)
            {
                return string.Equals(this.Title, other.Title, StringComparison.OrdinalIgnoreCase);
            }
            return false;
        }

        /// <inheritdoc />
        public override string ToString()
        {
            return $"{Title} (IsUrgent: {IsUrgent}, IsImportant: {IsImportant}, Tags: {string.Join(", ", Tags)})";
        }
    }
}
