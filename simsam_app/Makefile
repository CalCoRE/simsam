COFFEE=coffee
SOURCES := $(wildcard coffee/*.coffee)
JS_FILES := $(addprefix js/,$(notdir $(SOURCES:.coffee=.js)))


all: $(JS_FILES)

js/%.js: coffee/%.coffee
	$(COFFEE) -o js -c $<
