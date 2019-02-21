import Jasmine = require("jasmine")

const j = new Jasmine({})

j.configureDefaultReporter({
    showColors: true,
})
j.execute()
