$(function(){

    window.socket = io.connect('http://localhost');
    
    /*
    *   Log sockets
    */
    //Original func
    var x = socket.$emit;
    socket.$emit = function(){
         var event = arguments[0];
         var feed  = arguments[1];
         //Log
         console.log(event + ":", feed);
        //To pass listener  
        x.apply(this, Array.prototype.slice.call(arguments));       
    };

    // Will contain our app componments
    var App = {
        Models: {},
        Views: {},
        Collections: {}
    }

    /* 
    * Task Model
    */
    App.Models.Task = Backbone.Model.extend({
        urlRoot: 'task',
        idAttribute: "_id",
        socket:window.socket,
        initialize: function () {
          
          this.ioBind('update', window.socket, this.serverUpdate, this);
          this.ioBind('delete', window.socket, this.serverDelete, this);
        },
        // Will contain default attributes.
        defaults:{
            title: 'New task',
            checked: false,
            importance: 0
        },
        // Helper function for checking/unchecking a task
        toggle: function(){
            this.save('checked', !this.get('checked'));
        },
        
        serverUpdate: function(data) {
            console.log('serverUpdate');
            this.set(data);
            console.log(this);
        },
        
        serverDelete: function(task) {

            if (this.collection) {
                this.collection.remove(this);
            } else {
                this.trigger('remove', this);
            }
        }
    });

    /* 
    * Task Collection
    */
    App.Collections.Tasks = Backbone.Collection.extend({
        url: 'tasks',
        initialize: function () {

          this.ioBind('create', window.socket, this.serverCreate, this);
        },
        
        serverCreate: function (task) {
            // make sure no duplicates, just in case
            var exists = this.get(task._id);
            if (!exists) {
              this.add(task);
            }
        },

        // Will hold objects of the Task model
        model: App.Models.Task
    });


    /* 
    * Task View
    */
    App.Views.Task = Backbone.View.extend({
        tagName: 'div',
        className: 'alert',
        template: _.template($('#taskTemplate').html()),
        events:{
            'click .taskCheckbox': 'toggleTask',
            'click .removeTask': 'removeTask',
            'click .closeEditMode': 'closeEditMode',
            "submit .editTaskForm"  : "editTask",
            "dblclick"  : "editMode"
        },

        initialize: function(){
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'remove', this.remove);
        },

        render: function(){

            var className = '';
            
            if(this.model.get('checked')){
                // if the task is done 
                className = 'alert alert-success';
            } else {
                var classNames = ["alert alert-info", "alert alert-warning", "alert alert-error"];
                // choose the alert class based on importance field
                className = classNames[this.model.get('importance')];
            }
            // Create the HTML
            this.$el.attr('class', className)
            .html(this.template(this.model.toJSON()))
            //check the radio field
            .find('input:radio[name=importance]:eq(' + this.model.get('importance') + ')')
            .prop('checked', true);

            return this;
        },

        editMode: function(){
            // show edit form
            this.$el.addClass('editMode');
        },

        closeEditMode: function(e){
            // prevent from submit
            if(typeof e != 'undefined') {
                e.preventDefault();
            }
            // hide edit form
            this.$el.removeClass('editMode');
            //reset title value
            this.$('.taskTitleEditInput').val(this.model.get('title'));
            //reset importance radio value
            this.$('input:radio[name=importance]:eq(' + this.model.get('importance') + ')')
            .prop('checked', true);
        },

        toggleTask: function(){
            // check/uncheck task
            this.model.toggle();
        },

        removeTask: function(){
            // Silent is true so that we react to the server
            // broadcasting the remove event.
            this.model.destroy();
        },

        editTask: function(e) {

            // prevent from default submit
            e.preventDefault();
            // get title value
            var title = this.$('.taskTitleEditInput').val();
            // Prevent empty validation
            if (!title) return;

            // Edit the task
            this.model.save({
                title: title,
                importance: this.$el.find('input[name=importance]:checked').val()
            });
            this.closeEditMode();           
        }
    });

    /* 
    * Tasks View
    */
    App.Views.Tasks = Backbone.View.extend({

        el: $('#tasks'),

        initialize: function(){
            //listen the add event
            this.listenTo(this.collection, 'add', this.addOne);
        },

        addOne: function(model){

            //create a new collection view
            var taskView = new App.Views.Task({model: model});
            //render the collection
            this.$el.prepend(taskView.render().el);
        },

        render: function(){
            //render all collection's elements
            this.collection.forEach(this.addOne, this);
            return this;
        }
    });

    /* 
    * Tasks View
    */
    App.Views.App = Backbone.View.extend({

        // Base the view on an existing element
        el: $('#app'),

        events: {
          "submit #taskForm":  "createOnEnter"
        },

        initialize: function(){
            // initialize task list
            this.tasks = new App.Collections.Tasks();
        },

        start: function(){
            // setup the tasks view
            var taskListView = new App.Views.Tasks({collection: this.tasks});
            // get data from local storage
            this.tasks.fetch();
        },

        createOnEnter: function(e) {

            // prevent from default submit
            e.preventDefault();
            // get task's title
            var titleInput = $('#newTask');
            // prevent empty submit
            if (!titleInput.val()) return;
            // Create a new task
            /*this.tasks.create({
                title: titleInput.val(),
                importance: $('#taskForm input[name=importance]:checked').val()
            });*/

            var _task = new App.Models.Task({
                title: titleInput.val(),
                importance: $('#taskForm input[name=importance]:checked').val()
            });

            _task.save();

            // empty the title field
            titleInput.val('');
        },
    });

    var app = new App.Views.App();
    // start the app
    app.start();
});