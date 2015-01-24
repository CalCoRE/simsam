COFFEE=coffee
SOURCES := $(wildcard coffee/*.coffee)
JS_FILES := $(addprefix js/,$(notdir $(SOURCES:.coffee=.js)))
CFLAGS := --map


all: $(JS_FILES)

js/%.js: coffee/%.coffee
	$(COFFEE) $(CFLAGS) -o js -c $<
